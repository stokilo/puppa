testPdfTextContent = async function (config) {
    await expectPdfContent("https://graduateland.com/api/v2/users/jesper/cv", educationGovYkCaPdfContent);
}
