import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Repository } from 'typeorm';
import { ValidateUserDto } from './dto/validate-user.dto';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let configService: ConfigService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    const validateUserDto: ValidateUserDto = {
      telegramId: '123456789',
      username: 'testuser',
    };

    it('should return existing user when found by telegramId', async () => {
      const existingUser = {
        id: 1,
        telegramId: '123456789',
        username: 'testuser',
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);

      const result = await service.validateUser(validateUserDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { telegramId: validateUserDto.telegramId },
      });
      expect(result).toEqual({
        valid: true,
        telegramId: existingUser.telegramId,
        username: existingUser.username,
        userId: existingUser.id,
      });
    });

    it('should create new user when not found by telegramId', async () => {
      const newUser = {
        id: 1,
        telegramId: '123456789',
        username: 'testuser',
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const result = await service.validateUser(validateUserDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { telegramId: validateUserDto.telegramId },
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        telegramId: validateUserDto.telegramId,
        username: validateUserDto.username,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(newUser);
      expect(result).toEqual({
        valid: true,
        telegramId: newUser.telegramId,
        username: newUser.username,
        userId: newUser.id,
      });
    });

    it('should create new user without username when not provided', async () => {
      const dtoWithoutUsername: ValidateUserDto = {
        telegramId: '123456789',
      };

      const newUser = {
        id: 1,
        telegramId: '123456789',
        username: null,
        createdAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const result = await service.validateUser(dtoWithoutUsername);

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        telegramId: dtoWithoutUsername.telegramId,
        username: dtoWithoutUsername.username,
      });
      expect(result).toEqual({
        valid: true,
        telegramId: newUser.telegramId,
        username: newUser.username,
        userId: newUser.id,
      });
    });

    it('should update username if existing user has different username', async () => {
      const existingUser = {
        id: 1,
        telegramId: '123456789',
        username: 'oldusername',
        createdAt: new Date(),
      };

      const updatedUser = {
        ...existingUser,
        username: 'newusername',
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.validateUser({
        telegramId: '123456789',
        username: 'newusername',
      });

      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...existingUser,
        username: 'newusername',
      });
      expect(result).toEqual({
        valid: true,
        telegramId: updatedUser.telegramId,
        username: updatedUser.username,
        userId: updatedUser.id,
      });
    });
  });
});
