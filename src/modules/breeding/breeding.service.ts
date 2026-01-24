import { Insemination, IInsemination } from './insemination.model';
import { Animal } from '../animal';
import { Notification } from '../notification/notification.model';
import { PregnancyStatus } from '../../types';
import { NotFoundError, BadRequestError } from '../../utils/ApiError';
import { config } from '../../config';
import mongoose from 'mongoose';

/**
 * Normalize a date to UTC midnight (start of day in UTC)
 */
const normalizeToUTCMidnight = (date: Date | string): Date => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

/**
 * Get UTC end of day (23:59:59.999)
 */
const getUTCEndOfDay = (date: Date | string): Date => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
};

export interface CreateInseminationData {
  animalId: string;
  inseminationDate: Date;
  doctorName?: string;
  semenType?: string;
  breed?: string;
  notes?: string;
  userEmail?: string; // Email of the logged-in user creating the record
}

export interface UpdateInseminationData {
  inseminationDate?: Date;
  doctorName?: string;
  semenType?: string;
  breed?: string;
  notes?: string;
}

export interface UpdatePregnancyStatusData {
  status: PregnancyStatus;
  deliveryDate?: Date;
  notes?: string;
}

export interface InseminationFilter {
  animalId?: string;
  status?: PregnancyStatus;
  startDate?: Date;
  endDate?: Date;
}

class BreedingService {
  /**
   * Create a new insemination record
   * Prevents insemination if animal is sold
   */
  async create(data: CreateInseminationData): Promise<IInsemination> {
    // Check if animal exists and is not sold
    const animal = await Animal.findById(data.animalId);

    if (!animal) {
      throw new NotFoundError('Animal not found');
    }

    if (animal.isSold) {
      throw new BadRequestError('Cannot create insemination record for a sold animal');
    }

    if (!animal.isActive) {
      throw new BadRequestError('Cannot create insemination record for an inactive animal');
    }

    // Check if animal is female
    if (animal.gender !== 'female') {
      throw new BadRequestError('Insemination can only be recorded for female animals');
    }

    const inseminationDate = normalizeToUTCMidnight(data.inseminationDate);

    // Auto-calculate pregnancy check date (90 days from insemination)
    const pregnancyCheckDate = new Date(inseminationDate);
    pregnancyCheckDate.setUTCDate(pregnancyCheckDate.getUTCDate() + 90);

    const insemination = await Insemination.create({
      animal: new mongoose.Types.ObjectId(data.animalId),
      inseminationDate,
      pregnancyCheckDate,
      doctorName: data.doctorName,
      semenType: data.semenType,
      breed: data.breed,
      notes: data.notes,
      pregnancyStatus: 'check_pending',
      notificationSent: false,
    });

    // Automatically create a notification for pregnancy check (90 days after insemination)
    try {
      await Notification.create({
        animal: new mongoose.Types.ObjectId(data.animalId),
        insemination: insemination._id,
        type: 'pregnancy_check',
        channel: 'email',
        status: 'pending',
        scheduledDate: pregnancyCheckDate,
        isSent: false,
        subject: `Pregnancy Check Reminder - ${animal.serialNumber}`,
        message: `Pregnancy check is due for ${animal.animalType} ${animal.serialNumber}${animal.nickName ? ` (${animal.nickName})` : ''}. Insemination was performed on ${inseminationDate.toLocaleDateString()}. Please schedule a pregnancy check.`,
        recipientEmail: data.userEmail || config.notificationEmail || config.smtpUser,
        metadata: {
          animalSerialNumber: animal.serialNumber,
          animalNickName: animal.nickName,
          animalType: animal.animalType,
          inseminationDate: inseminationDate.toISOString(),
        },
      });
      console.log(`✅ Created pregnancy check notification for animal ${animal.serialNumber} scheduled for ${pregnancyCheckDate.toLocaleDateString()} to be sent to ${data.userEmail || config.notificationEmail}`);
    } catch (notificationError) {
      // Log error but don't fail the insemination creation
      console.error('Failed to create pregnancy check notification:', notificationError);
    }

    return insemination.populate('animal', 'serialNumber nickName animalType');
  }

  /**
   * Get all insemination records with filters
   */
  async getAll(
    filter: InseminationFilter = {},
    page = 1,
    limit = 10
  ): Promise<{ inseminations: IInsemination[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filter.animalId) {
      query.animal = new mongoose.Types.ObjectId(filter.animalId);
    }

    if (filter.status) {
      query.pregnancyStatus = filter.status;
    }

    if (filter.startDate || filter.endDate) {
      query.inseminationDate = {};
      if (filter.startDate) {
        (query.inseminationDate as Record<string, Date>).$gte = normalizeToUTCMidnight(filter.startDate);
      }
      if (filter.endDate) {
        (query.inseminationDate as Record<string, Date>).$lte = getUTCEndOfDay(filter.endDate);
      }
    }

    const skip = (page - 1) * limit;

    const [inseminations, total] = await Promise.all([
      Insemination.find(query)
        .populate('animal', 'serialNumber nickName animalType')
        .sort({ inseminationDate: -1 })
        .skip(skip)
        .limit(limit),
      Insemination.countDocuments(query),
    ]);

    return { inseminations, total };
  }

  /**
   * Get insemination record by ID
   */
  async getById(id: string): Promise<IInsemination> {
    const insemination = await Insemination.findById(id)
      .populate('animal', 'serialNumber nickName animalType breed');

    if (!insemination) {
      throw new NotFoundError('Insemination record not found');
    }

    return insemination;
  }

  /**
   * Get insemination records by animal ID
   */
  async getByAnimalId(animalId: string): Promise<IInsemination[]> {
    const animal = await Animal.findById(animalId);

    if (!animal) {
      throw new NotFoundError('Animal not found');
    }

    return Insemination.find({ animal: new mongoose.Types.ObjectId(animalId) })
      .sort({ inseminationDate: -1 });
  }

  /**
   * Update insemination record
   */
  async update(id: string, data: UpdateInseminationData): Promise<IInsemination> {
    const insemination = await Insemination.findById(id);

    if (!insemination) {
      throw new NotFoundError('Insemination record not found');
    }

    // If insemination date changes, recalculate pregnancy check date
    let updateData: Record<string, unknown> = { ...data };
    
    if (data.inseminationDate) {
      const inseminationDate = normalizeToUTCMidnight(data.inseminationDate);
      
      const pregnancyCheckDate = new Date(inseminationDate);
      pregnancyCheckDate.setUTCDate(pregnancyCheckDate.getUTCDate() + 90);
      
      updateData = {
        ...updateData,
        inseminationDate,
        pregnancyCheckDate,
      };
    }

    const updatedInsemination = await Insemination.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('animal', 'serialNumber nickName animalType');

    if (!updatedInsemination) {
      throw new NotFoundError('Insemination record not found');
    }

    return updatedInsemination;
  }

  /**
   * Update pregnancy status
   */
  async updateStatus(id: string, data: UpdatePregnancyStatusData): Promise<IInsemination> {
    const insemination = await Insemination.findById(id);

    if (!insemination) {
      throw new NotFoundError('Insemination record not found');
    }

    // Validate status transition
    const validTransitions: Record<PregnancyStatus, PregnancyStatus[]> = {
      check_pending: ['pregnant_confirmed', 'failed'],
      pregnant_confirmed: ['delivered', 'failed'],
      failed: [],
      delivered: [],
    };

    const currentStatus = insemination.pregnancyStatus;
    if (!validTransitions[currentStatus].includes(data.status)) {
      throw new BadRequestError(
        `Cannot change status from "${currentStatus}" to "${data.status}"`
      );
    }

    // If status is delivered, delivery date is required
    if (data.status === 'delivered' && !data.deliveryDate) {
      throw new BadRequestError('Delivery date is required when status is delivered');
    }

    const updateData: Record<string, unknown> = {
      pregnancyStatus: data.status,
      statusUpdatedAt: new Date(),
    };

    if (data.deliveryDate) {
      updateData.deliveryDate = normalizeToUTCMidnight(data.deliveryDate);
    }

    if (data.notes) {
      updateData.notes = data.notes;
    }

    const updatedInsemination = await Insemination.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('animal', 'serialNumber nickName animalType');

    if (!updatedInsemination) {
      throw new NotFoundError('Insemination record not found');
    }

    return updatedInsemination;
  }

  /**
   * Delete insemination record
   */
  async delete(id: string): Promise<IInsemination> {
    const insemination = await Insemination.findById(id);

    if (!insemination) {
      throw new NotFoundError('Insemination record not found');
    }

    await Insemination.findByIdAndDelete(id);

    return insemination;
  }

  /**
   * Get pending pregnancy checks (for notifications)
   * Returns inseminations where:
   * - pregnancyCheckDate is today or in the past
   * - status is still check_pending
   * - notification not yet sent
   * - animal is not sold
   */
  async getPendingPregnancyChecks(): Promise<IInsemination[]> {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const inseminations = await Insemination.find({
      pregnancyCheckDate: { $lte: today },
      pregnancyStatus: 'check_pending',
      notificationSent: false,
    }).populate('animal', 'serialNumber nickName animalType isSold');

    // Filter out sold animals
    return inseminations.filter((ins) => {
      const animal = ins.animal as unknown as { isSold: boolean };
      return !animal.isSold;
    });
  }

  /**
   * Mark notification as sent
   */
  async markNotificationSent(id: string): Promise<void> {
    await Insemination.findByIdAndUpdate(id, {
      $set: { notificationSent: true },
    });
  }

  /**
   * Get pregnancy statistics
   */
  async getStatistics(): Promise<{
    total: number;
    checkPending: number;
    pregnantConfirmed: number;
    failed: number;
    delivered: number;
    successRate: number;
  }> {
    const [checkPending, pregnantConfirmed, failed, delivered] = await Promise.all([
      Insemination.countDocuments({ pregnancyStatus: 'check_pending' }),
      Insemination.countDocuments({ pregnancyStatus: 'pregnant_confirmed' }),
      Insemination.countDocuments({ pregnancyStatus: 'failed' }),
      Insemination.countDocuments({ pregnancyStatus: 'delivered' }),
    ]);

    const total = checkPending + pregnantConfirmed + failed + delivered;
    const successfulOutcomes = pregnantConfirmed + delivered;
    const completedCases = successfulOutcomes + failed;
    const successRate = completedCases > 0 
      ? Math.round((successfulOutcomes / completedCases) * 100) 
      : 0;

    return {
      total,
      checkPending,
      pregnantConfirmed,
      failed,
      delivered,
      successRate,
    };
  }
}

export const breedingService = new BreedingService();
