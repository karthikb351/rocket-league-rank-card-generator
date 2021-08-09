import axios from 'axios';

export const getRankDataFromTrackerGG = (platform: string, id: string) => {
  return axios
    .get(
      `https://api.tracker.gg/api/v2/rocket-league/standard/profile/${platform}/${id}`
    )
    .then(response => response.data);
};
