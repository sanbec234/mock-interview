const BASE_URL = 'http://127.0.0.1:5000'; // Backend base URL

/**
 * Sends the user's answer to the backend and fetches the next question or redirects if test is complete.
 * @param {string} answer - The user's answer.
 * @returns {Promise<string|null>} - The next question from the backend or `null` if redirecting.
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

    if (data.redirect) {
      // Redirect the user to the specified URL
      window.location.href = data.url;
      return null; // No further question since we're redirecting
    }

    return data.question; // Return the next question from the backend
  } catch (error) {
    console.error('Error communicating with the backend:', error);
    throw error;
  }
};


/**
 * Sends the user's login credentials to the backend.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} - The response from the backend.
 */
export const sendLoginToBackend = async (email, password) => {
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Failed to log in');
    }

    const data = await response.json();
    return data; // Return the backend response
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
//     return data.question; // Return the next question from the backend
//   } catch (error) {
//     console.error('Error communicating with the backend:', error);
//     throw error;
//   }
// };
