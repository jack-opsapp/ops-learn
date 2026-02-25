-- Migration 4: Add interactive_tool to content_block_type enum

ALTER TYPE content_block_type ADD VALUE IF NOT EXISTS 'interactive_tool';
