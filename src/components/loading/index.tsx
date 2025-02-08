const FullScreenLoading = (props: {
  fullScreen?: boolean;
  description?: string;
}) => {
  return (
    <div
      className="fullscreen-loader flex-col"
      style={{ position: props.fullScreen === false ? "absolute" : "fixed" }}
    >
      <div className="spinner"></div>
      <div className="text-white text-sm mt-3">
        {props.description || "加载中"}
      </div>
      <style jsx>{`
         {
          .fullscreen-loader {
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;

            justify-content: center;
            align-items: center;
            z-index: 9999;
          }

          .spinner {
            border: 6px solid #f3f3f3;
            border-top: 6px solid #3498db;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 2s linear infinite;
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        }
      `}</style>
    </div>
  );
};

export default FullScreenLoading;
