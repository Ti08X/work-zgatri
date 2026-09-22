CREATE UNIQUE INDEX `idx_products_sku` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `idx_sales_sold_on` ON `sales` (`sold_on`);--> statement-breakpoint
CREATE INDEX `idx_social_posts_platform_planned_at` ON `social_posts` (`platform`,`planned_at`);--> statement-breakpoint
CREATE INDEX `idx_task_logs_task_id_created_at` ON `task_logs` (`task_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_tasks_completed_end_date` ON `tasks` (`completed`,`end_date`);