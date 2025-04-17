import { Injectable, ConflictException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group, GroupDocument } from './schemas/group.schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { User } from 'src/users/schemas/user.schema';
import { nanoid } from 'nanoid';

@Injectable()
export class GroupService {
  constructor(@InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
  @InjectModel(User.name) private readonly userModel: Model<User>,
) {}
  
async create(createGroupDto: CreateGroupDto, creatorId: string): Promise<Group> {
    const { name, description, visibility, maxCapacity } = createGroupDto;

    const existingGroup = await this.groupModel.findOne({ name });
    if (existingGroup) {
      throw new ConflictException('Group with this name already exists');
    }

    const user = await this.userModel.findById(creatorId);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.groupId) {
      throw new ForbiddenException('User already belongs to a group');
    }

    const group = new this.groupModel({
      name,
      description,
      visibility,
      maxCapacity,
      admin: creatorId,
      members: [creatorId],
      inviteCode: visibility === 'private' ? nanoid(8) : null,
    });

    const savedGroup = await group.save();

    user.groupId = (savedGroup._id as Types.ObjectId).toString();

    user.role = 'admin';
    await user.save()

    return savedGroup;
  }

  async searchPublicGroupsByName(name: string): Promise<Group[]> {
    const regex = new RegExp(name, 'i'); // case-insensitive search
  
    return this.groupModel.find({
      name: { $regex: regex },
      visibility: 'public',
    });
  }
  
  async requestToJoin(groupId: string, userId: string): Promise<any> {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');
    if (group.visibility !== 'public') throw new ForbiddenException('Group is not public');
    if (group.members.includes(userId)) throw new ConflictException('User already a member');
    if (group.joinRequests.includes(userId)) throw new ConflictException('Already requested to join');
    if (group.members.length >= group.maxCapacity) throw new ForbiddenException('Group is full');
  
    group.joinRequests.push(userId);
    await group.save();
    return { message: 'Join request submitted' };
  }


  // Service to get group members
 async getMembers(groupId: string, userId: string): Promise<string[]> {
    const group = await this.groupModel.findById(groupId).populate('members');

    if (!group) {
      throw new NotFoundException('Group not found');
    }
    // Check if the user is the admin or a member of the group
    if (group.admin.toString() !== userId && !group.members.some(member => member.toString() === userId)) {
      throw new ForbiddenException('You do not have permission to view this group\'s members');
    }
    return group.members;
  }



  async handleJoinRequest(groupId: string, userIdToHandle: string, approve: boolean, requesterId: string): Promise<any> {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');
    if (group.admin !== requesterId) {
      throw new ForbiddenException('Only the group admin can manage join requests');
    }
  
    const requestIndex = group.joinRequests.indexOf(userIdToHandle);
    if (requestIndex === -1) throw new NotFoundException('User has not requested to join');
  
    group.joinRequests.splice(requestIndex, 1);
  
    if (approve) {
      if (group.members.length >= group.maxCapacity) {
        throw new ForbiddenException('Group is at full capacity');
      }
      group.members.push(userIdToHandle);
    }
  
    await group.save();
    return {
      message: approve ? 'User added to group' : 'Join request rejected',
    };
  }
  
  //Admin invite
  async inviteUser(groupId: string, email: string, adminId: string): Promise<any> {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    if (group.admin.toString() !== adminId) {
      throw new ForbiddenException('Only the group admin can send invites');
    }

    if (group.visibility !== 'private') {
      throw new BadRequestException('Invites can only be sent for private groups');
    }

    if (group.members.length >= group.maxCapacity) {
      throw new ForbiddenException('Group is already full');
    }

    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('User with this email does not exist');

    if (user.groupId) {
      throw new ConflictException('User already belongs to a group');
    }

    // Generate or reuse an invite code
    if (!group.inviteCode) {
      group.inviteCode = Math.random().toString(36).substring(2, 8);
      await group.save();
    }

    // In a real app, you could email this code to the user
    return {
      message: `Invite code sent to ${email}`,
      inviteCode: group.inviteCode,
    };
  }

  async deleteGroup(groupId: string, requesterId: string): Promise<any> {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');
  
    if (group.admin !== requesterId) {
      throw new ForbiddenException('Only the group admin can delete the group');
    }
  
    await this.groupModel.findByIdAndDelete(groupId);
    return { message: 'Group deleted successfully' };
  }
  
  
  
}
