import { createContext, ReactNode, useContext, useState } from "react";

type CreditContextType = {
  credits: number | null;
  setCredits: (val: number | null) => void;
  syncCredits: (val: unknown) => void;
};

const CreditContext = createContext<CreditContextType>({
  credits: null,
  setCredits: () => {},
  syncCredits: () => {},
});


export const useCredits = () => useContext(CreditContext);

export const CreditProvider = ({ children }: { children: ReactNode }) => {
  const [credits, setCredits] = useState<number | null>(null);

 const syncCredits = (val: unknown) => {
  const nextCredits = Number(val);

  if (Number.isFinite(nextCredits)) {
    setCredits(nextCredits);
  }
};


  return (
    <CreditContext.Provider value={{ credits, setCredits, syncCredits }}>
      {children}
    </CreditContext.Provider>
  );
};
