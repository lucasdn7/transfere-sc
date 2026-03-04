
interface ParcelProgressBarProps {
  progressPercentage: number;
  className?: string;
}

export function ParcelProgressBar({ progressPercentage, className = "" }: ParcelProgressBarProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-green-500 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        {Math.round(progressPercentage)}% concluído
      </div>
    </div>
  );
}
