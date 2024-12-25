const BASE_URL = 'http://127.0.0.1:5000'; // Backend base URL

/**
 * Sends the user's answer to the backend and fetches the next question.
 * @param {string} answer - The user's answer.
 * @returns {Promise<string>} - The next question from the backend.
 */
export const sendAnswerToBackend = async (answer) => {
  try {
    const response = await fetch(`${BASE_URL}/api/send-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answer }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch the next question');
    }

    const data = await response.json();
    return data.question; // Return the next question from the backend
  } catch (error) {
    console.error('Error communicating with the backend:', error);
    throw error;
  }
};



// const BASE_URL = 'http://127.0.0.1:5000'; // Backend base URL

// /**
//  * Sends the user's answer to the backend and fetches the next question.
//  * @param {string} answer - The user's answer.
//  * @returns {Promise<string>} - The next question from the backend.
//  */
// export const sendAnswerToBackend = async (answer) => {
//   try {
//     const response = await fetch(`${BASE_URL}/api/send-answer`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ answer }),
//     });

//     if (!response.ok) {
//       throw new Error('Failed to fetch the next question');
//     }

//     const data = await response.json();
//     return data.next_question;
//   } catch (error) {
//     console.error('Error communicating with the backend:', error);
//     throw error;
//   }
// };