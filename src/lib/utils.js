export const formatMoney = (money) => {
  if (!money) "0,00";

  return money.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
