CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"icon" text,
	"color" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debt_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"debt_id" text NOT NULL,
	"amount" numeric NOT NULL,
	"date" date NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"creditor" text,
	"type" text NOT NULL,
	"total_amount" numeric NOT NULL,
	"paid_amount" numeric DEFAULT '0' NOT NULL,
	"monthly_payment" numeric NOT NULL,
	"start_date" date NOT NULL,
	"status" text NOT NULL,
	"pursuit_number" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"color" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"asset_name" text NOT NULL,
	"amount_invested" numeric NOT NULL,
	"current_value" numeric,
	"investment_date" date NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"initial_balance" numeric DEFAULT '0' NOT NULL,
	"monthly_salary" numeric DEFAULT '0' NOT NULL,
	"onboarding_done" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_contributions" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"amount" numeric NOT NULL,
	"date" date NOT NULL,
	"note" text,
	"transaction_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"goal_amount" numeric NOT NULL,
	"saved_amount" numeric DEFAULT '0' NOT NULL,
	"target_date" date,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"amount" numeric NOT NULL,
	"category_id" text NOT NULL,
	"date" date NOT NULL,
	"note" text,
	"is_recurring" boolean DEFAULT false,
	"recurrence" text,
	"recurrence_end" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debt_id_debts_id_fk" FOREIGN KEY ("debt_id") REFERENCES "public"."debts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_category_id_investment_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."investment_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_contributions" ADD CONSTRAINT "savings_contributions_project_id_savings_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."savings_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;