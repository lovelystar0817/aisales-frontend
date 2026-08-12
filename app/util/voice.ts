export const usesSgVoice = (companyName: string) => {
  const companyNameLower = companyName.toLowerCase();

  const usesSgAccent =
    companyNameLower.includes('hupo') ||
    companyNameLower.includes('prudential');

  return usesSgAccent;
};
