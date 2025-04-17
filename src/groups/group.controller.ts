import { Controller, Post, Body, Get, Param, Req, Delete, UseGuards, Query } from '@nestjs/common';
import { GroupService } from './group.service';
import { Group } from './schemas/group.schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createGroupDto: CreateGroupDto, @Req() req): Promise<Group> {
    const userId = req.user.userId;
    return this.groupService.create(createGroupDto, userId);    
  }


  @UseGuards(JwtAuthGuard)
  @Get('search')
  async search(@Query('name') name: string): Promise<Group[]> {
    return this.groupService.searchPublicGroupsByName(name);
  }


  @UseGuards(JwtAuthGuard) 
  @Post(':id/join-request')
async requestJoin(@Param('id') groupId: string, @Req() req) {
  return this.groupService.requestToJoin(groupId, req.user.userId);
}

@UseGuards(JwtAuthGuard) 
@Get(':id/members')
async getMembers(@Param('id') groupId: string, @Req() req) {
  const userId = req.user.userId;
  return this.groupService.getMembers(groupId, userId);
}

@UseGuards(JwtAuthGuard) 
@Post(':id/handle-request')
async handleJoinRequest(
  @Param('id') groupId: string,
  @Body() body: { userId: string; approve: boolean },
  @Req() req) { 

  const requesterId = req.user.userId;
  return this.groupService.handleJoinRequest(groupId, body.userId, body.approve, requesterId);
}

@UseGuards(JwtAuthGuard)
  @Post(':id/invite')
  async invite(@Param('id') groupId: string, @Body('email') email: string, @Req() req) {
    const userId = req.user.userId;
    return this.groupService.inviteUser(groupId, email, userId);
  }

//Delete Group
@UseGuards(JwtAuthGuard) 
@Delete(':id')
async deleteGroup(@Param('id') groupId: string, @Req() req) {
  return this.groupService.deleteGroup(groupId, req.user.userId);
}


}
