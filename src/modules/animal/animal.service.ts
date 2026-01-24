import { Animal, IAnimal } from './animal.model';
import { AnimalType } from '../../types';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/ApiError';

export interface CreateAnimalData {
  userId: string;
  serialNumber: string;
  nickName: string;
  animalType: AnimalType;
  identificationTag?: string;
  breed?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female';
  purchaseDate?: Date;
  purchasePrice?: number;
  purchasePlace?: string;
  notes?: string;
}

export interface UpdateAnimalData {
  serialNumber?: string;
  nickName?: string;
  animalType?: AnimalType;
  identificationTag?: string;
  breed?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female';
  purchaseDate?: Date;
  purchasePrice?: number;
  purchasePlace?: string;
  notes?: string;
}

export interface SellAnimalData {
  soldDate?: Date;
  soldPrice?: number;
  soldTo?: string;
  soldNotes?: string;
}

export interface AnimalFilter {
  animalType?: AnimalType;
  isSold?: boolean;
  isActive?: boolean;
  search?: string;
}

class AnimalService {
  /**
   * Create a new animal
   */
  async create(data: CreateAnimalData): Promise<IAnimal> {
    // Check for duplicate serialNumber within same animalType and user
    const existingAnimal = await Animal.findOne({
      userId: data.userId,
      serialNumber: data.serialNumber,
      animalType: data.animalType,
    });

    if (existingAnimal) {
      throw new ConflictError(
        `An animal with serial number "${data.serialNumber}" already exists for ${data.animalType}`
      );
    }

    const animal = await Animal.create(data);
    return animal;
  }

  /**
   * Get all animals with filters
   */
  async getAll(
    userId: string,
    filter: AnimalFilter = {},
    page = 1,
    limit = 10
  ): Promise<{ animals: IAnimal[]; total: number }> {
    const query: Record<string, unknown> = {
      userId, // Filter by user
    };

    if (filter.animalType) {
      query.animalType = filter.animalType;
    }

    if (typeof filter.isSold === 'boolean') {
      query.isSold = filter.isSold;
    }

    if (typeof filter.isActive === 'boolean') {
      query.isActive = filter.isActive;
    }

    if (filter.search) {
      query.$or = [
        { serialNumber: { $regex: filter.search, $options: 'i' } },
        { nickName: { $regex: filter.search, $options: 'i' } },
        { identificationTag: { $regex: filter.search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [animals, total] = await Promise.all([
      Animal.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Animal.countDocuments(query),
    ]);

    return { animals, total };
  }

  /**
   * Get animal by ID
   */
  async getById(id: string, userId: string): Promise<IAnimal> {
    const animal = await Animal.findOne({ _id: id, userId });

    if (!animal) {
      throw new NotFoundError('Animal not found');
    }

    return animal;
  }

  /**
   * Update animal
   */
  async update(id: string, userId: string, data: UpdateAnimalData): Promise<IAnimal> {
    const animal = await Animal.findOne({ _id: id, userId });

    if (!animal) {
      throw new NotFoundError('Animal not found');
    }

    // If updating serialNumber or animalType, check for duplicates
    if (data.serialNumber || data.animalType) {
      const checkSerialNumber = data.serialNumber || animal.serialNumber;
      const checkAnimalType = data.animalType || animal.animalType;

      const existingAnimal = await Animal.findOne({
        userId,
        serialNumber: checkSerialNumber,
        animalType: checkAnimalType,
        _id: { $ne: id },
      });

      if (existingAnimal) {
        throw new ConflictError(
          `An animal with serial number "${checkSerialNumber}" already exists for ${checkAnimalType}`
        );
      }
    }

    const updatedAnimal = await Animal.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!updatedAnimal) {
      throw new NotFoundError('Animal not found');
    }

    return updatedAnimal;
  }

  /**
   * Sell an animal
   */
  async sell(id: string, userId: string, data: SellAnimalData): Promise<IAnimal> {
    const animal = await Animal.findOne({ _id: id, userId });

    if (!animal) {
      throw new NotFoundError('Animal not found');
    }

    if (animal.isSold) {
      throw new BadRequestError('Animal is already sold');
    }

    const updatedAnimal = await Animal.findByIdAndUpdate(
      id,
      {
        $set: {
          isSold: true,
          soldDate: data.soldDate || new Date(),
          soldPrice: data.soldPrice,
          soldTo: data.soldTo,
          soldNotes: data.soldNotes,
          isActive: false,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedAnimal) {
      throw new NotFoundError('Animal not found');
    }

    return updatedAnimal;
  }

  /**
   * Delete animal (soft delete - mark as inactive)
   */
  async delete(id: string, userId: string): Promise<IAnimal> {
    const animal = await Animal.findOne({ _id: id, userId });

    if (!animal) {
      throw new NotFoundError('Animal not found');
    }

    const deletedAnimal = await Animal.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!deletedAnimal) {
      throw new NotFoundError('Animal not found');
    }

    return deletedAnimal;
  }

  /**
   * Permanently delete animal
   */
  async permanentDelete(id: string, userId: string): Promise<void> {
    const animal = await Animal.findOne({ _id: id, userId });

    if (!animal) {
      throw new NotFoundError('Animal not found');
    }

    await Animal.findByIdAndDelete(id);
  }

  /**
   * Get animal counts by type
   */
  async getCounts(userId: string): Promise<{
    cows: number;
    buffaloes: number;
    total: number;
    active: number;
    sold: number;
  }> {
    const [cows, buffaloes, active, sold] = await Promise.all([
      Animal.countDocuments({ userId, animalType: 'cow', isActive: true }),
      Animal.countDocuments({ userId, animalType: 'buffalo', isActive: true }),
      Animal.countDocuments({ userId, isActive: true, isSold: false }),
      Animal.countDocuments({ userId, isSold: true }),
    ]);

    return {
      cows,
      buffaloes,
      total: cows + buffaloes,
      active,
      sold,
    };
  }

  /**
   * Get active animals (not sold) by type
   */
  async getActiveByType(animalType: AnimalType, userId: string): Promise<IAnimal[]> {
    return Animal.find({
      userId,
      animalType,
      isActive: true,
      isSold: false,
    }).sort({ serialNumber: 1 });
  }
}

export const animalService = new AnimalService();
