const handovers = [];

export function createHandover(professionalId, bedIds) {
  const handover = {
    id: handovers.length + 1,
    professionalId,
    bedIds,
    createdAt: new Date().toISOString()
  };

  handovers.push(handover);
  return handover;
}

export function getHandovers() {
  return handovers;
}

export function getHandoverById(id) {
  return handovers.find(h => h.id === id);
}