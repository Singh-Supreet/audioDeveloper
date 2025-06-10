const API_KEY = 'c2UB2QMvlCHnKs42eYGkwz2zziOTwLI6NfG1Slld';
const BASE_URL = 'https://freesound.org/apiv2';

export const searchSounds = async (query) => {
  try {
    const response = await fetch(
      `${BASE_URL}/search/text/?query=${encodeURIComponent(query)}&fields=id,name,previews,username&token=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.results.map(sound => {
      const previewUrl = sound.previews?.['preview-hq-mp3'] ||
        sound.previews?.['preview-lq-mp3'] ||
        null;

      return {
        id: sound.id,
        name: sound.name,
        username: sound.username,
        previewUrl: previewUrl,
        downloadUrl: `https://freesound.org/apiv2/sounds/${sound.id}/download/?token=${API_KEY}`,
      };
    });
  } catch (err) {
    console.error('Error searching sounds:', err);
    throw err;
  }
};

export const downloadSound = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }
    return await response.blob();
  } catch (err) {
    console.error('Error downloading sound:', err);
    throw err;
  }
};