import { Module } from '@nestjs/common';
import { SubcategoriesModule } from '../subcategories/subcategories.module';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [SubcategoriesModule],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
