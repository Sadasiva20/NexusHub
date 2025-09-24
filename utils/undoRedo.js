// utils/undoRedo.js
// Functions for handling undo and redo operations in the code editor

export const undo = (history, historyIndex, setHistoryIndex, setCode, socketRef) => {
  if (historyIndex > 0) {
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setCode(history[newIndex]);
    socketRef.current.emit('code:edit', { code: history[newIndex] });
  }
};

export const redo = (history, historyIndex, setHistoryIndex, setCode, socketRef) => {
  if (historyIndex < history.length - 1) {
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setCode(history[newIndex]);
    socketRef.current.emit('code:edit', { code: history[newIndex] });
  }
};
