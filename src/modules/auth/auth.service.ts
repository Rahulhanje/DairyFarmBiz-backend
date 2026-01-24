import { User, IUser, UserRole } from './user.model';
import { generateToken } from '../../middlewares/auth';
import { BadRequestError, UnauthorizedError, ConflictError } from '../../utils/ApiError';

export interface SignupData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  countryCode?: string;
  role?: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  token: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    const { name, email, password, phone, countryCode, role } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      passwordHash: password, // Will be hashed by pre-save hook
      phone,
      countryCode: countryCode || '+91',
      role: role || 'staff',
    });

    // Generate token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const { email, password } = data;

    console.log('[DEBUG] Login attempt with email:', email);

    // Find user with password field
    const user = await User.findOne({ email, isActive: true }).select(
      '+passwordHash'
    );

    console.log('[DEBUG] User found:', user ? 'Yes' : 'No');

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    console.log('[DEBUG] Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<Omit<IUser, 'passwordHash'> | null> {
    const user = await User.findById(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }
    return user;
  }
}

export const authService = new AuthService();
