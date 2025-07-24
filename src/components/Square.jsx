import { useDrop } from 'react-dnd';
import Piece from './Piece';

const Square = ({ position, piece, isLight, onDrop }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'piece',
    drop: (item) => onDrop(item.from, position),
    collect: monitor => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`w-16 h-16 flex items-center justify-center
        ${isOver ? 'bg-blue-400' : isLight ? 'bg-gray-200' : 'bg-green-700'}`}
    >
      {piece && <Piece piece={piece} position={position} />}
    </div>
  );
};

export default Square;
