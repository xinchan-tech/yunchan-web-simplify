import { PropsWithChildren, useEffect, useRef, useState } from "react";
import UploadUtil from "../../Service/uploadUtil";
import { uid } from "radash";
import { JknIcon } from "@/components";
const AliyunOssUploader = (
  props: PropsWithChildren<{ onChange: (value: string) => void; value: string }>
) => {
  const { onChange, value } = props;
  const imgUploadRef = useRef<HTMLInputElement>();
  const [previewUrl, setPreviewUrl] = useState("");
  useEffect(() => {
    setPreviewUrl(value);
  }, [value]);
  const dealFile = (file: any) => {
    if (file.type && file.type.startsWith("image/")) {
      var reader = new FileReader();
      reader.readAsDataURL(file);
    }
    const fileName = uid(32);
    UploadUtil.shared
      .uploadImg(file, fileName)
      .then((res) => {
        if (res && res.url) {
          // setPreviewUrl(res.url);
          typeof onChange === "function" && onChange(res.url);
        }
      })
      .catch((error) => {
        console.log("文件上传失败！->", error);
      });
  };

  const onFileClick = (event: any) => {
    event.target.value = ""; // 防止选中一个文件取消后不能再选中同一个文件
  };
  const onFileChange = () => {
    if (imgUploadRef.current) {
      let File = (imgUploadRef.current.files || [])[0];
      dealFile(File);
    }
  };

  const chooseFile = () => {
    imgUploadRef.current && imgUploadRef.current.click();
  };

  return (
    <div onClick={chooseFile}>
      <input
        onClick={onFileClick}
        onChange={onFileChange}
        type="file"
        multiple={false}
        accept="image/*"
        ref={imgUploadRef}
        style={{ display: "none" }}
      />
      <div className="w-16 h-16 rounded-full border border-solid border-gray-300 overflow-hidden">
        {previewUrl ? (
          <img className="w-16 h-16" src={previewUrl} alt="" />
        ) : (
          <div className="flex h-full flex-col justify-center items-center">
            <JknIcon name="pick_image" className="w-8 h-8" />
            <span className="mt-2 text-sm">上传图片</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AliyunOssUploader;
