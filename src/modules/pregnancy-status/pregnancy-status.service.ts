import { PregnancyStatusHistory, IPregnancyStatusHistory } from './pregnancy-status.model';
import { Insemination } from '../breeding';
import { Animal } from '../animal';
import { PregnancyStatus } from '../../types';
import { NotFoundError, BadRequestError } from '../../utils/ApiError';
import mongoose from 'mongoose';

// Valid status transitions
const VALID_TRANSITIONS: Record<PregnancyStatus, PregnancyStatus[]> = {
  check_pending: ['pregnant_confirmed', 'failed'],
  pregnant_confirmed: ['delivered', 'failed'],
  failed: [], // Terminal state
  delivered: [], // Terminal state
};

export interface AddStatusData {
  userId: string;
  inseminationId: string;
  status: PregnancyStatus;
  notes?: string;
  changedBy?: string;
  deliveryDate?: Date;
  calfCount?: number;
  calfDetails?: string;
}

export interface StatusHistoryFilter {
  inseminationId?: string;
  animalId?: string;
  status?: PregnancyStatus;
  startDate?: Date;
  endDate?: Date;
}

class PregnancyStatusService {
  /**
   * Add a new status to the timeline
   * Does not overwrite - creates a new history entry
   * Validates logical status flow
   */
  async addStatus(data: AddStatusData): Promise<IPregnancyStatusHistory> {
    // Get the insemination record
    const insemination = await Insemination.findOne({
      _id: data.inseminationId,
      userId: new mongoose.Types.ObjectId(data.userId),
    }).populate('animal', 'serialNumber nickName isSold');

    if (!insemination) {
      throw new NotFoundError('Insemination record not found');
    }

    // Check if animal is sold
    const animal = insemination.animal as unknown as { _id: mongoose.Types.ObjectId; isSold: boolean };
    if (animal.isSold) {
      throw new BadRequestError('Cannot update status for a sold animal');
    }

    // Get current status from insemination
    const currentStatus = insemination.pregnancyStatus;

    // Validate status transition
    if (!VALID_TRANSITIONS[currentStatus].includes(data.status)) {
      if (currentStatus === data.status) {
        throw new BadRequestError(`Status is already "${currentStatus}"`);
      }
      throw new BadRequestError(
        `Invalid status transition: cannot change from "${currentStatus}" to "${data.status}". ` +
        `Valid transitions from "${currentStatus}": ${VALID_TRANSITIONS[currentStatus].join(', ') || 'none (terminal state)'}`
      );
    }

    // Validate delivery-specific requirements
    if (data.status === 'delivered') {
      if (!data.deliveryDate) {
        throw new BadRequestError('Delivery date is required when status is "delivered"');
      }
    }

    // Create status history entry
    const statusHistory = await PregnancyStatusHistory.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      insemination: new mongoose.Types.ObjectId(data.inseminationId),
      animal: animal._id,
      status: data.status,
      previousStatus: currentStatus,
      changedAt: new Date(),
      changedBy: data.changedBy,
      notes: data.notes,
      deliveryDate: data.deliveryDate,
      calfCount: data.calfCount,
      calfDetails: data.calfDetails,
    });

    // Update the insemination record with new status
    await Insemination.findByIdAndUpdate(data.inseminationId, {
      $set: {
        pregnancyStatus: data.status,
        statusUpdatedAt: new Date(),
        ...(data.deliveryDate && { deliveryDate: data.deliveryDate }),
      },
    });

    return statusHistory.populate([
      { path: 'insemination', select: 'inseminationDate pregnancyCheckDate' },
      { path: 'animal', select: 'serialNumber nickName animalType' },
    ]);
  }

  /**
   * Get status timeline for an insemination
   */
  async getTimelineByInsemination(userId: string, inseminationId: string): Promise<IPregnancyStatusHistory[]> {
    const insemination = await Insemination.findOne({
      _id: inseminationId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!insemination) {
      throw new NotFoundError('Insemination record not found');
    }

    return PregnancyStatusHistory.find({
      userId: new mongoose.Types.ObjectId(userId),
      insemination: new mongoose.Types.ObjectId(inseminationId),
    })
      .sort({ changedAt: 1 }) // Chronological order
      .populate('animal', 'serialNumber nickName animalType');
  }

  /**
   * Get status history for an animal (all inseminations)
   */
  async getHistoryByAnimal(userId: string, animalId: string): Promise<IPregnancyStatusHistory[]> {
    const animal = await Animal.findOne({
      _id: animalId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!animal) {
      throw new NotFoundError('Animal not found');
    }

    return PregnancyStatusHistory.find({
      userId: new mongoose.Types.ObjectId(userId),
      animal: new mongoose.Types.ObjectId(animalId),
    })
      .sort({ changedAt: -1 })
      .populate('insemination', 'inseminationDate pregnancyCheckDate');
  }

  /**
   * Get all status history with filters
   */
  async getAll(
    userId: string,
    filter: StatusHistoryFilter = {},
    page = 1,
    limit = 10
  ): Promise<{ history: IPregnancyStatusHistory[]; total: number }> {
    const query: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (filter.inseminationId) {
      query.insemination = new mongoose.Types.ObjectId(filter.inseminationId);
    }

    if (filter.animalId) {
      query.animal = new mongoose.Types.ObjectId(filter.animalId);
    }

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.startDate || filter.endDate) {
      query.changedAt = {};
      if (filter.startDate) {
        const startDate = new Date(filter.startDate);
        startDate.setHours(0, 0, 0, 0);
        (query.changedAt as Record<string, Date>).$gte = startDate;
      }
      if (filter.endDate) {
        const endDate = new Date(filter.endDate);
        endDate.setHours(23, 59, 59, 999);
        (query.changedAt as Record<string, Date>).$lte = endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      PregnancyStatusHistory.find(query)
        .populate('insemination', 'inseminationDate pregnancyCheckDate')
        .populate('animal', 'serialNumber nickName animalType')
        .sort({ changedAt: -1 })
        .skip(skip)
        .limit(limit),
      PregnancyStatusHistory.countDocuments(query),
    ]);

    return { history, total };
  }

  /**
   * Get current status for an insemination
   */
  async getCurrentStatus(userId: string, inseminationId: string): Promise<{
    currentStatus: PregnancyStatus;
    lastUpdate: IPregnancyStatusHistory | null;
    timeline: IPregnancyStatusHistory[];
  }> {
    const insemination = await Insemination.findOne({
      _id: inseminationId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!insemination) {
      throw new NotFoundError('Insemination record not found');
    }

    const timeline = await PregnancyStatusHistory.find({
      userId: new mongoose.Types.ObjectId(userId),
      insemination: new mongoose.Types.ObjectId(inseminationId),
    }).sort({ changedAt: 1 });

    const lastUpdate = timeline.length > 0 ? timeline[timeline.length - 1] : null;

    return {
      currentStatus: insemination.pregnancyStatus,
      lastUpdate,
      timeline,
    };
  }

  /**
   * Get status change statistics
   */
  async getStatistics(userId: string): Promise<{
    totalChanges: number;
    byStatus: Record<string, number>;
    byMonth: Array<{ month: string; count: number }>;
  }> {
    const [byStatusResult, byMonthResult] = await Promise.all([
      PregnancyStatusHistory.aggregate([
        {
          $match: { userId: new mongoose.Types.ObjectId(userId) },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      PregnancyStatusHistory.aggregate([
        {
          $match: { userId: new mongoose.Types.ObjectId(userId) },
        },
        {
          $group: {
            _id: {
              year: { $year: '$changedAt' },
              month: { $month: '$changedAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { '_id.year': -1, '_id.month': -1 },
        },
        {
          $limit: 12,
        },
      ]),
    ]);

    const byStatus: Record<string, number> = {};
    let totalChanges = 0;

    for (const item of byStatusResult) {
      byStatus[item._id] = item.count;
      totalChanges += item.count;
    }

    const byMonth = byMonthResult.map((item) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      count: item.count,
    }));

    return {
      totalChanges,
      byStatus,
      byMonth,
    };
  }

  /**
   * Get available transitions for current status
   */
  getAvailableTransitions(currentStatus: PregnancyStatus): PregnancyStatus[] {
    return VALID_TRANSITIONS[currentStatus] || [];
  }
}

export const pregnancyStatusService = new PregnancyStatusService();
