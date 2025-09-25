// utils/undoRedo.js
// Functions for handling undo and redo operations in the code editor

export const undo = (history, historyIndex, setHistoryIndex, setCode, channelRef, userId) => {
  if (historyIndex > 0) {
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setCode(history[newIndex]);
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'code_update',
        payload: { code: history[newIndex], userId }
      });
    }
  }
};

export const redo = (history, historyIndex, setHistoryIndex, setCode, channelRef, userId) => {
  if (historyIndex < history.length - 1) {
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setCode(history[newIndex]);
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'code_update',
        payload: { code: history[newIndex], userId }
      });
    }
  }
};
