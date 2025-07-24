import { useDrag } from 'react-dnd';

const Piece = ({ piece, position }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'piece',
    item: { from: position },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const imageName = `${piece.color}${piece.type.toUpperCase()}`; // e.g., wP, bK

  return (
    <img
      ref={drag}
      src={`/pieces/${imageName}.png`}
      alt={imageName}
      className={`w-full h-full object-contain ${isDragging ? 'opacity-30' : ''}`}
    />
  );
};

export default Piece;
