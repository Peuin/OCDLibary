import { Module } from '@nestjs/common';

import { AppSettingsModule } from '../app-settings/app-settings.module';
import { BookModule } from '../book/book.module';
import { CollectionModule } from '../collection/collection.module';
import { SmartScopeModule } from '../smart-scope/smart-scope.module';
import { LibraryModule } from '../library/library.module';
import { DashboardController } from './dashboard.controller';
import { DashboardFeaturedShelfController } from './dashboard-featured-shelf.controller';
import { DashboardFeaturedShelfImageStorage } from './dashboard-featured-shelf-image.storage';
import { DashboardFeaturedShelfRepository } from './dashboard-featured-shelf.repository';
import { DashboardFeaturedShelfService } from './dashboard-featured-shelf.service';
import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';
import { DashboardWidgetRepository } from './dashboard-widget.repository';
import { DashboardWidgetService } from './dashboard-widget.service';

@Module({
  imports: [BookModule, LibraryModule, SmartScopeModule, CollectionModule, AppSettingsModule],
  controllers: [DashboardController, DashboardFeaturedShelfController],
  providers: [
    DashboardService,
    DashboardRepository,
    DashboardWidgetService,
    DashboardWidgetRepository,
    DashboardFeaturedShelfService,
    DashboardFeaturedShelfRepository,
    DashboardFeaturedShelfImageStorage,
  ],
  exports: [DashboardService, DashboardWidgetService],
})
export class DashboardModule {}
