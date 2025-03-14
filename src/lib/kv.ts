/**
 * Cloudflare KV wrapper for managing user data
 */

import type { UserProfile } from "../types/db";

/**
 * KV wrapper class for managing user data
 */
export class KVStore {
    private namespace: KVNamespace;

    constructor(namespace: KVNamespace) {
        this.namespace = namespace;
    }

    /**
     * Get user profile from KV
     * @param userId User ID
     * @returns User profile or null if not found
     */
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        try {
            const data = await this.namespace.get(`user:${userId}`, "json");
            return (data as UserProfile) || null;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return null;
        }
    }

    /**
     * Create or update user profile
     * @param profile User profile data
     * @returns Success status
     */
    async setUserProfile(profile: UserProfile): Promise<boolean> {
        try {
            // Always update the lastUpdated timestamp
            profile.lastUpdated = Date.now();

            await this.namespace.put(`user:${profile.userId}`, JSON.stringify(profile));
            return true;
        } catch (error) {
            console.error("Error saving user profile:", error);
            return false;
        }
    }

    /**
     * Update specific fields of a user profile
     * @param userId User ID
     * @param updates Partial user profile with fields to update
     * @returns Updated user profile or null if failed
     */
    async updateUserProfile(
        userId: string,
        updates: Partial<UserProfile>,
    ): Promise<UserProfile | null> {
        try {
            const currentProfile = await this.getUserProfile(userId);

            if (!currentProfile) {
                // Create new profile if it doesn't exist
                const newProfile: UserProfile = {
                    userId,
                    lastUpdated: Date.now(),
                    ...updates,
                };

                await this.setUserProfile(newProfile);
                return newProfile;
            }

            // Merge current profile with updates
            const updatedProfile = {
                ...currentProfile,
                ...updates,
                lastUpdated: Date.now(),
            };

            await this.setUserProfile(updatedProfile);
            return updatedProfile;
        } catch (error) {
            console.error("Error updating user profile:", error);
            return null;
        }
    }

    /**
     * Add a chat message to user history
     * @param userId User ID
     * @param messageId Message ID
     * @param content Message content
     * @returns Success status
     */
    async addChatMessage(userId: string, messageId: string, content: string): Promise<boolean> {
        try {
            const profile = await this.getUserProfile(userId);

            if (!profile) {
                return false;
            }

            const chatHistory = profile.chatHistory || [];

            // Add new message to history
            chatHistory.push({
                messageId,
                timestamp: Date.now(),
                content,
            });

            // Limit history size if needed (e.g., keep last 50 messages)
            const MAX_HISTORY = 50;
            if (chatHistory.length > MAX_HISTORY) {
                chatHistory.splice(0, chatHistory.length - MAX_HISTORY);
            }

            // Update profile with new chat history
            await this.updateUserProfile(userId, { chatHistory });
            return true;
        } catch (error) {
            console.error("Error adding chat message:", error);
            return false;
        }
    }

    /**
     * Delete user profile
     * @param userId User ID
     * @returns Success status
     */
    async deleteUserProfile(userId: string): Promise<boolean> {
        try {
            await this.namespace.delete(`user:${userId}`);
            return true;
        } catch (error) {
            console.error("Error deleting user profile:", error);
            return false;
        }
    }

    /**
     * Extract and update user parameters from chat content using LLM
     * This method would integrate with an LLM to analyze chat content
     * and extract relevant user information
     *
     * @param userId User ID
     * @param content Chat content to analyze
     * @returns Updated user profile or null if failed
     */
    async updateProfileFromChat(userId: string, content: string): Promise<UserProfile | null> {
        try {
            // Get current profile
            const currentProfile = await this.getUserProfile(userId);

            if (!currentProfile) {
                return null;
            }

            // This is where you would integrate with your LLM to analyze the content
            // and extract relevant user parameters
            // For now, we'll just return the current profile

            // Example of what this might look like with an LLM:
            /*
      const extractedParams = await llmService.extractUserParams(content, currentProfile);

      if (extractedParams) {
        return this.updateUserProfile(userId, extractedParams);
      }
      */

            return currentProfile;
        } catch (error) {
            console.error("Error updating profile from chat:", error);
            return null;
        }
    }
}
