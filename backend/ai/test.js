require("dotenv").config();
const { summarizeText } = require("./summarize");

(async () => {
  const longText = `
    Social media platforms have transformed how people communicate, share information, 
    and build communities online. These platforms allow users to create profiles, 
    connect with friends and family, share photos and videos, and engage in discussions 
    on topics ranging from politics to entertainment. However, they also raise concerns 
    about privacy, misinformation, and mental health, as excessive use has been linked 
    to anxiety and reduced attention spans. Companies building these platforms must 
    balance user engagement with responsible design choices.
  `;
  const result = await summarizeText(longText);
  console.log(result);
})();

//how to test 
//type |  node ai/test.js | in terminal (you need to cd backend before run this command)
// it should be summarize you message

// try replacing the message in `longText` below with a longer paragraph
// to see the AI actually condense it into a shorter summary