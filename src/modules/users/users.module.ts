import { AuthModule } from '@modules/auth/auth.module';
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
    imports: [AuthModule],
    providers: [UsersController],
    controllers: [UsersService],
})
export class UsersModule {}
