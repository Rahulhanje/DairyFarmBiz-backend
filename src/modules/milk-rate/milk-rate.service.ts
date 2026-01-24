import { MilkRate, IMilkRate } from './milk-rate.model';
import { AnimalType } from '../../types';
import { NotFoundError } from '../../utils/ApiError';

// Lazy import to avoid circular dependency
let _milkCollectionService: any = null;
const getMilkCollectionService = () => {
  if (!_milkCollectionService) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _milkCollectionService = require('../milk-collection/milk-collection.service').milkCollectionService;
  }
  return _milkCollectionService;
};

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

export interface CreateMilkRateData {
  animalType: AnimalType;
  ratePerLiter: number;
  effectiveFrom: Date;
}

class MilkRateService {
  /**
   * Create a new milk rate or update if one already exists for the same date and animal type
   * Also recalculates affected milk collections
   */
  async create(data: CreateMilkRateData): Promise<IMilkRate> {
    const effectiveDate = normalizeToUTCMidnight(data.effectiveFrom);

    // Check if rate already exists for this animalType and effectiveFrom date
    const existingRate = await MilkRate.findOne({
      animalType: data.animalType,
      effectiveFrom: effectiveDate,
    });

    let milkRate: IMilkRate;

    // If rate exists for same day, update it instead of throwing error
    if (existingRate) {
      existingRate.ratePerLiter = data.ratePerLiter;
      await existingRate.save();
      milkRate = existingRate;
    } else {
      milkRate = await MilkRate.create({
        ...data,
        effectiveFrom: effectiveDate,
      });
    }

    // Recalculate all affected milk collections
    const milkCollectionService = getMilkCollectionService();
    await milkCollectionService.recalculateByRate(data.animalType, effectiveDate);

    return milkRate;
  }

  /**
   * Get applicable rate for a specific date and animal type
   * Returns the most recent rate that is effective on or before the given date
   */
  async getRateByDate(animalType: AnimalType, date: Date): Promise<IMilkRate> {
    const queryDate = getUTCEndOfDay(date);

    const rate = await MilkRate.findOne({
      animalType,
      effectiveFrom: { $lte: queryDate },
    }).sort({ effectiveFrom: -1 });

    if (!rate) {
      throw new NotFoundError(
        `No rate found for ${animalType} on or before ${date.toISOString().split('T')[0]}`
      );
    }

    return rate;
  }

  /**
   * Get all rates for an animal type (sorted by effectiveFrom desc)
   */
  async getAllByType(animalType: AnimalType): Promise<IMilkRate[]> {
    return MilkRate.find({ animalType }).sort({ effectiveFrom: -1 });
  }

  /**
   * Get all rates (sorted by effectiveFrom desc)
   */
  async getAll(): Promise<IMilkRate[]> {
    return MilkRate.find().sort({ effectiveFrom: -1, animalType: 1 });
  }

  /**
   * Get current rates for both cow and buffalo
   */
  async getCurrentRates(): Promise<{
    cow: IMilkRate | null;
    buffalo: IMilkRate | null;
  }> {
    // Use LOCAL date (not UTC) to match user's perspective
    // When user creates a rate for "today", they mean their local today
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [cowRate, buffaloRate] = await Promise.all([
      MilkRate.findOne({
        animalType: 'cow',
        effectiveFrom: { $lte: today },
      }).sort({ effectiveFrom: -1 }),
      MilkRate.findOne({
        animalType: 'buffalo',
        effectiveFrom: { $lte: today },
      }).sort({ effectiveFrom: -1 }),
    ]);

    return {
      cow: cowRate,
      buffalo: buffaloRate,
    };
  }

  /**
   * Get rate by ID (for reference only)
   */
  async getById(id: string): Promise<IMilkRate> {
    const rate = await MilkRate.findById(id);

    if (!rate) {
      throw new NotFoundError('Milk rate not found');
    }

    return rate;
  }

  /**
   * Update an existing milk rate
   * Only allows updating the rate per liter, not the date or animal type
   * Also recalculates affected milk collections
   */
  async update(id: string, ratePerLiter: number): Promise<IMilkRate> {
    const rate = await MilkRate.findById(id);

    if (!rate) {
      throw new NotFoundError('Milk rate not found');
    }

    rate.ratePerLiter = ratePerLiter;
    await rate.save();

    // Recalculate all affected milk collections
    const milkCollectionService = getMilkCollectionService();
    await milkCollectionService.recalculateByRate(rate.animalType, rate.effectiveFrom);

    return rate;
  }

  /**
   * Delete a milk rate
   */
  async delete(id: string): Promise<IMilkRate> {
    const rate = await MilkRate.findByIdAndDelete(id);

    if (!rate) {
      throw new NotFoundError('Milk rate not found');
    }

    return rate;
  }
}

export const milkRateService = new MilkRateService();
