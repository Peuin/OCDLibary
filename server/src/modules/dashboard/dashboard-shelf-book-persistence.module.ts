import { Module } from '@nestjs/common';

import { DashboardShelfBookMaterializer } from './dashboard-shelf-book-materializer';

@Module({
  providers: [DashboardShelfBookMaterializer],
  exports: [DashboardShelfBookMaterializer],
})
export class DashboardShelfBookPersistenceModule {}
