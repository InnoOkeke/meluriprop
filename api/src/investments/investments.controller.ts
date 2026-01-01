import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { PrivyGuard } from '../auth/privy.guard';

@Controller('investments')
@UseGuards(PrivyGuard)
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) { }

  @Post()
  create(@Request() req, @Body() createInvestmentDto: CreateInvestmentDto) {
    // req.user is set by PrivyGuard (the verified claims)
    // We assume the DID is the 'sub' or available in the claim
    console.log("User Claims:", req.user); // Debug
    const userId = req.user.id;
    return this.investmentsService.create(userId, createInvestmentDto);
  }

  @Get()
  findAll(@Request() req) {
    const userId = req.user.id;
    return this.investmentsService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.investmentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInvestmentDto: UpdateInvestmentDto) {
    return this.investmentsService.update(+id, updateInvestmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.investmentsService.remove(+id);
  }
}
