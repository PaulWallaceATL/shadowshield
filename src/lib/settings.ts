import { prisma } from './prisma';

export type Settings = {
  llmProvider: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
};

export const defaultSettings: Settings = {
  llmProvider: 'openai',
  model: 'gpt-3.5-turbo',
  maxTokens: 2048,
  temperature: 0.7,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0
};

export async function getUserSettings(userId: string): Promise<Settings> {
  if (!userId) {
    return defaultSettings;
  }

  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      // Create default settings for user
      await prisma.userSettings.create({
        data: {
          userId,
          settings: JSON.stringify(defaultSettings)
        }
      });
      return defaultSettings;
    }

    // Parse the JSON string from the database
    const parsedSettings = typeof settings.settings === 'string' 
      ? JSON.parse(settings.settings)
      : settings.settings;

    // Merge with default settings to ensure all fields exist
    return {
      ...defaultSettings,
      ...parsedSettings
    };
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return defaultSettings;
  }
}

export async function updateUserSettings(userId: string, settings: Partial<Settings>): Promise<Settings> {
  try {
    const currentSettings = await getUserSettings(userId);
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };

    await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        settings: JSON.stringify(updatedSettings)
      },
      update: {
        settings: JSON.stringify(updatedSettings)
      }
    });

    return updatedSettings;
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
}

export async function getSystemSettings(): Promise<Record<string, any>> {
  try {
    const settings = await prisma.systemSettings.findFirst();
    return settings ? JSON.parse(settings.value) : {};
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return {};
  }
}

export async function updateSystemSettings(settings: Record<string, any>): Promise<void> {
  try {
    await prisma.systemSettings.upsert({
      where: { key: 'system_settings' },
      create: {
        key: 'system_settings',
        value: JSON.stringify(settings)
      },
      update: {
        value: JSON.stringify(settings)
      }
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
} 