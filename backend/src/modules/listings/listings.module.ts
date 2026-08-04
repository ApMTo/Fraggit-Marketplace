import { Module } from '@nestjs/common';
import { AttributeDefinitionsModule } from '../attribute-definitions/attribute-definitions.module';
import { FilesModule } from '../files/files.module';
import { SubcategoriesModule } from '../subcategories/subcategories.module';
import { TelegramModule } from '../telegram/telegram.module';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [
    SubcategoriesModule,
    AttributeDefinitionsModule,
    FilesModule,
    TelegramModule,
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
