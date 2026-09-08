import { AuthModule } from '@modules/auth/auth.module';
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from './repositories/user.repository';
import { AddressRepository } from '@common/repositories/address.repository';

@Module({
    imports: [AuthModule],
    controllers: [UsersController],
    providers: [UsersService, UserRepository, AddressRepository],
})
export class UsersModule {}
