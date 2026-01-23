import { MilkCollection, IMilkCollection } from './milk-collection.model';
import { milkRateService } from '../milk-rate';
import { AnimalType, MilkSession } from '../../types';
import { NotFoundError, ConflictError } from '../../utils/ApiError';

export interface CreateMilkCollectionData {
  date: Date;
  session: MilkSession;
  animalType: AnimalType;
  totalMilk: number;
  notes?: string;
}

export interface UpdateMilkCollectionData {
  date?: Date;
  session?: MilkSession;
  animalType?: AnimalType;
  totalMilk?: number;
  notes?: string;
}

export interface MilkCollectionFilter {
  startDate?: Date;
  endDate?: Date;
  animalType?: AnimalType;
  session?: MilkSession;
}

class MilkCollectionService {
  /**
   * Create a new milk collection entry
   * Auto-fetches rate and calculates total amount
   */
  async create(data: CreateMilkCollectionData): Promise<IMilkCollection> {
    const entryDate = new Date(data.date);
    entryDate.setHours(0, 0, 0, 0);

    // Check for duplicate entry
    const existingEntry = await MilkCollection.findOne({
      date: entryDate,
      session: data.session,
      animalType: data.animalType,
    });

    if (existingEntry) {
      throw new ConflictError(
        `Milk entry for ${data.animalType} on ${entryDate.toISOString().split('T')[0]} (${data.session}) already exists`
      );
    }

    // Auto-fetch rate based on milk date
    const rate = await milkRateService.getRateByDate(data.animalType, entryDate);
    const rateApplied = rate.ratePerLiter;

    // Auto-calculate total amount
    const totalAmount = data.totalMilk * rateApplied;

    const milkCollection = await MilkCollection.create({
      date: entryDate,
      session: data.session,
      animalType: data.animalType,
      totalMilk: data.totalMilk,
      rateApplied,
      totalAmount,
      notes: data.notes,
    });

    return milkCollection;
  }

  /**
   * Get all milk collections with filters
   */
  async getAll(
    filter: MilkCollectionFilter = {},
    page = 1,
    limit = 10
  ): Promise<{ collections: IMilkCollection[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filter.startDate || filter.endDate) {
      query.date = {};
      if (filter.startDate) {
        (query.date as Record<string, Date>).$gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        const endDate = new Date(filter.endDate);
        endDate.setHours(23, 59, 59, 999);
        (query.date as Record<string, Date>).$lte = endDate;
      }
    }

    if (filter.animalType) {
      query.animalType = filter.animalType;
    }

    if (filter.session) {
      query.session = filter.session;
    }

    const skip = (page - 1) * limit;

    const [collections, total] = await Promise.all([
      MilkCollection.find(query)
        .sort({ date: -1, session: 1 })
        .skip(skip)
        .limit(limit),
      MilkCollection.countDocuments(query),
    ]);

    return { collections, total };
  }

  /**
   * Get milk collection by ID
   */
  async getById(id: string): Promise<IMilkCollection> {
    const collection = await MilkCollection.findById(id);

    if (!collection) {
      throw new NotFoundError('Milk collection entry not found');
    }

    return collection;
  }

  /**
   * Update milk collection
   * Auto-recalculates rate and total amount if date, animalType, or totalMilk changes
   */
  async update(id: string, data: UpdateMilkCollectionData): Promise<IMilkCollection> {
    const collection = await MilkCollection.findById(id);

    if (!collection) {
      throw new NotFoundError('Milk collection entry not found');
    }

    // Determine final values for duplicate check and rate calculation
    const finalDate = data.date ? new Date(data.date) : collection.date;
    finalDate.setHours(0, 0, 0, 0);
    const finalSession = data.session || collection.session;
    const finalAnimalType = data.animalType || collection.animalType;
    const finalTotalMilk = data.totalMilk !== undefined ? data.totalMilk : collection.totalMilk;

    // Check for duplicate if date, session, or animalType is changing
    if (data.date || data.session || data.animalType) {
      const existingEntry = await MilkCollection.findOne({
        date: finalDate,
        session: finalSession,
        animalType: finalAnimalType,
        _id: { $ne: id },
      });

      if (existingEntry) {
        throw new ConflictError(
          `Milk entry for ${finalAnimalType} on ${finalDate.toISOString().split('T')[0]} (${finalSession}) already exists`
        );
      }
    }

    // Recalculate rate and total if date, animalType, or totalMilk changes
    let rateApplied = collection.rateApplied;
    let totalAmount = collection.totalAmount;

    if (data.date || data.animalType || data.totalMilk !== undefined) {
      const rate = await milkRateService.getRateByDate(finalAnimalType, finalDate);
      rateApplied = rate.ratePerLiter;
      totalAmount = finalTotalMilk * rateApplied;
    }

    const updatedCollection = await MilkCollection.findByIdAndUpdate(
      id,
      {
        $set: {
          date: finalDate,
          session: finalSession,
          animalType: finalAnimalType,
          totalMilk: finalTotalMilk,
          rateApplied,
          totalAmount,
          notes: data.notes !== undefined ? data.notes : collection.notes,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedCollection) {
      throw new NotFoundError('Milk collection entry not found');
    }

    return updatedCollection;
  }

  /**
   * Delete milk collection entry
   */
  async delete(id: string): Promise<IMilkCollection> {
    const collection = await MilkCollection.findById(id);

    if (!collection) {
      throw new NotFoundError('Milk collection entry not found');
    }

    await MilkCollection.findByIdAndDelete(id);

    return collection;
  }

  /**
   * Get daily summary for a specific date
   */
  async getDailySummary(date: Date): Promise<{
    date: Date;
    cowMorning: number;
    cowEvening: number;
    cowTotal: number;
    cowAmount: number;
    buffaloMorning: number;
    buffaloEvening: number;
    buffaloTotal: number;
    buffaloAmount: number;
    grandTotal: number;
    grandAmount: number;
  }> {
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const entries = await MilkCollection.find({ date: queryDate });

    const summary = {
      date: queryDate,
      cowMorning: 0,
      cowEvening: 0,
      cowTotal: 0,
      cowAmount: 0,
      buffaloMorning: 0,
      buffaloEvening: 0,
      buffaloTotal: 0,
      buffaloAmount: 0,
      grandTotal: 0,
      grandAmount: 0,
    };

    for (const entry of entries) {
      if (entry.animalType === 'cow') {
        if (entry.session === 'morning') {
          summary.cowMorning = entry.totalMilk;
        } else {
          summary.cowEvening = entry.totalMilk;
        }
        summary.cowTotal += entry.totalMilk;
        summary.cowAmount += entry.totalAmount;
      } else {
        if (entry.session === 'morning') {
          summary.buffaloMorning = entry.totalMilk;
        } else {
          summary.buffaloEvening = entry.totalMilk;
        }
        summary.buffaloTotal += entry.totalMilk;
        summary.buffaloAmount += entry.totalAmount;
      }
    }

    summary.grandTotal = summary.cowTotal + summary.buffaloTotal;
    summary.grandAmount = summary.cowAmount + summary.buffaloAmount;

    return summary;
  }

  /**
   * Get entries for a specific date
   */
  async getByDate(date: Date): Promise<IMilkCollection[]> {
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    return MilkCollection.find({ date: queryDate }).sort({ animalType: 1, session: 1 });
  }
}

export const milkCollectionService = new MilkCollectionService();
