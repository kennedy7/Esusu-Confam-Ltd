import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { Group, GroupSchema } from './schemas/group.schema';
import { User, UserSchema } from '../users/schemas/user.schema'; 
import { UsersModule } from '../users/users.module'; 

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema },
      { name: User.name, schema: UserSchema }, 
    ]),
    UsersModule,
  ],
  controllers: [GroupController],
  providers: [GroupService],
})
export class GroupsModule {}
