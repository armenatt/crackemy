export const getTimeFromSeconds = (duration: number) => {
  const minutes = Math.floor(duration / 60);
  const hours = Math.floor(minutes / 60);
  const seconds = duration % 60;

  if (hours < 1) {
    return `${minutes} min ${seconds < 10 ? "0" : ""}${seconds} seconds`;
  }
  return `${hours}hr ${seconds < 10 ? "0" : ""}${minutes % 60} min`;
};
