ALTER TABLE "agent_actions" DROP CONSTRAINT "agent_actions_thread_id_agent_threads_id_fkey";--> statement-breakpoint
ALTER TABLE "agent_actions" DROP CONSTRAINT "agent_actions_message_id_agent_messages_id_fkey";--> statement-breakpoint
ALTER TABLE "agent_attachments" DROP CONSTRAINT "agent_attachments_thread_id_agent_threads_id_fkey";--> statement-breakpoint
ALTER TABLE "agent_attachments" DROP CONSTRAINT "agent_attachments_message_id_agent_messages_id_fkey";--> statement-breakpoint
ALTER TABLE "agent_messages" DROP CONSTRAINT "agent_messages_thread_id_agent_threads_id_fkey";--> statement-breakpoint
DROP TABLE "agent_actions";--> statement-breakpoint
DROP TABLE "agent_attachments";--> statement-breakpoint
DROP TABLE "agent_messages";--> statement-breakpoint
DROP TABLE "agent_threads";