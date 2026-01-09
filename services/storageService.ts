import { TELEGRAM_BOTS, TelegramBotConfig } from './telegramBots';

// State to track load balancing
let currentBotIndex = 0;

// Track disabled bots: Map<BotToken, CooldownExpiryTimestamp>
const botCooldowns = new Map<string, number>();
const COOLDOWN_DURATION_MS = 60 * 1000; // 1 minute cooldown if a bot fails

/**
 * Gets the next available bot using Round Robin logic.
 * Skips bots currently in cooldown.
 */
const getNextBot = (): TelegramBotConfig => {
  let attempts = 0;
  const totalBots = TELEGRAM_BOTS.length;

  while (attempts < totalBots) {
    const bot = TELEGRAM_BOTS[currentBotIndex];
    currentBotIndex = (currentBotIndex + 1) % totalBots; // Advance pointer

    // Check if bot is in cooldown
    const cooldownUntil = botCooldowns.get(bot.token);
    if (cooldownUntil && Date.now() < cooldownUntil) {
      attempts++;
      continue;
    }

    return bot;
  }

  // If all bots are cooling down, just return the next one and hope for the best
  return TELEGRAM_BOTS[currentBotIndex];
};

/**
 * Uploads a file (Blob/File) to Telegram and returns a viewable URL.
 * Handles retries across different bots if one fails.
 */
export const uploadImageToTelegram = async (file: Blob | File): Promise<string> => {
  const MAX_RETRIES = 5;
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    const bot = getNextBot();
    
    try {
      console.log(`[Storage] Attempting upload with bot ${bot.name} (ID: ${bot.id})...`);
      
      const formData = new FormData();
      formData.append('chat_id', bot.chatId);
      formData.append('photo', file);

      // Step 1: Send Photo
      const uploadResponse = await fetch(`https://api.telegram.org/bot${bot.token}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      if (!uploadData.ok) {
        throw new Error(`Telegram API Error: ${uploadData.description}`);
      }

      // Get the highest resolution photo (last in array)
      const photos = uploadData.result.photo;
      const fileId = photos[photos.length - 1].file_id;

      // Step 2: Get File Path
      const fileResponse = await fetch(`https://api.telegram.org/bot${bot.token}/getFile?file_id=${fileId}`);
      const fileData = await fileResponse.json();

      if (!fileData.ok || !fileData.result.file_path) {
        throw new Error("Could not retrieve file path");
      }

      // Step 3: Construct URL
      // Note: This URL requires the token to be part of the path.
      const imageUrl = `https://api.telegram.org/file/bot${bot.token}/${fileData.result.file_path}`;
      
      console.log(`[Storage] Success! Image stored via ${bot.name}`);
      return imageUrl;

    } catch (error) {
      console.warn(`[Storage] Bot ${bot.name} failed. Marking for cooldown.`, error);
      
      // Mark this bot as bad for a while
      botCooldowns.set(bot.token, Date.now() + COOLDOWN_DURATION_MS);
      
      attempts++;
    }
  }

  throw new Error("All upload attempts failed. Please check your internet connection.");
};

/**
 * Converts a Base64 string to a Blob for uploading.
 */
export const base64ToBlob = async (base64: string): Promise<Blob> => {
  const response = await fetch(base64);
  return await response.blob();
};
