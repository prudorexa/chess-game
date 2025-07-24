import { useDrag } from 'react-dnd';

const Piece = ({ piece, position }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'piece',
    item: { from: position },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const getSymbol = {
    p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
    P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔',
  };

  return (
    <div
      ref={drag}
      className={`text-2xl select-none ${isDragging ? 'opacity-30' : ''}`}
    >
      {getSymbol[piece.type.toUpperCase()]}
    </div>
  );
};

export default Piece;
