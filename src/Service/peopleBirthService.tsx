import axios from 'axios';

const getPeopleBirth = async ({ month, day }: { month: string; day: string }) => {
    try {
      const response = await axios.get(`https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/births/${month}/${day}`); // Replace with your actual API endpoint
      return response.data;
    } catch (error) {
        return error
    }
  };


export default getPeopleBirth