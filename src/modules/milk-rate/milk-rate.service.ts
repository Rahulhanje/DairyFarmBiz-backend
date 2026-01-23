import { MilkRate, IMilkRate } from './milk-rate.model';
import { AnimalType } from '../../types';
import { NotFoundError, ConflictError } from '../../utils/ApiError';

export interface CreateMilkRateData {
  animalType: AnimalType;
  ratePerLiter: number;
  effectiveFrom: Date;
}

class MilkRateService {
  /**
   * Create a new milk rate
   * Old rates are never updated - only new rates are added
   */
  async create(data: CreateMilkRateData): Promise<IMilkRate> {
    const effectiveDate = new Date(data.effectiveFrom);
    effectiveDate.setHours(0, 0, 0, 0);

    // Check if rate already exists for this animalType and effectiveFrom date
    const existingRate = await MilkRate.findOne({
      animalType: data.animalType,
      effectiveFrom: effectiveDate,
    });

    if (existingRate) {
      throw new ConflictError(
        `A rate for ${data.animalType} already exists for this date. Old rates cannot be updated.`
      );
    }

    const milkRate = await MilkRate.create({
      ...data,
      effectiveFrom: effectiveDate,
    });

    return milkRate;
  }

  /**
   * Get applicable rate for a specific date and animal type
   * Returns the most recent rate that is effective on or before the given date
   */
  async getRateByDate(animalType: AnimalType, date: Date): Promise<IMilkRate> {
    const queryDate = new Date(date);
    queryDate.setHours(23, 59, 59, 999);

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
    const today = new Date();
    today.setHours(23, 59, 59, 999);

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
}

export const milkRateService = new MilkRateService();
