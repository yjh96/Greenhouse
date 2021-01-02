import os
import asyncio
from azure.iot.device.aio import IoTHubDeviceClient
from azure.core.exceptions import AzureError
from azure.storage.blob import BlobClient
from picamera import PiCamera

try:

    camera = PiCamera()
    camera.capture("/home/pi/Desktop/Remote/CAMERA/photo.jpg")

except Exception:
    pass

CONNECTION_STRING = "--BLOB STORAGE--"
PATH_TO_FILE = r"/home/pi/Desktop/Remote/CAMERA/photo.jpg"


async def storage_blob(blob_info, file_name):
    try:
        sas_url = "https://{}/{}/{}{}".format(
            blob_info["hostName"],
            blob_info["containerName"],
            blob_info["blobName"],
            blob_info["sasToken"]
        )

        print("\nUploading file: {} to Azure Storage as blob: {} in container {}\n".format(
            file_name, blob_info["blobName"], blob_info["containerName"]))

        # Upload the specified file
        with BlobClient.from_blob_url(sas_url) as blob_client:
            with open(file_name, "rb") as f:
                result = blob_client.upload_blob(f, overwrite=True)
                return (True, result)

    except FileNotFoundError as ex:
        # catch file not found and add an HTTP status code to return in notification to IoT Hub
        ex.status_code = 404
        return (False, ex)

    except AzureError as ex:
        # catch Azure errors that might result from the upload operation
        return (False, ex)


async def main():
    try:
        print("TEST upload TEST")

        conn_str = CONNECTION_STRING
        file_name = PATH_TO_FILE
        blob_name = os.path.basename(file_name)

        device_client = IoTHubDeviceClient.create_from_connection_string(
            conn_str)

        # 클라이언트 연걸
        await device_client.connect()

        # 정보 가져오기
        storage_info = await device_client.get_storage_info_for_blob(blob_name)

        # 저장소 업로드
        success, result = await storage_blob(storage_info, file_name)

        if success == True:
            print("Upload Success. result is : ")
            print(result)
            print()

            await device_client.notify_blob_upload_status(
                storage_info["correlationId"], True, 200, "OK : {}".format(
                    file_name)
            )
        else:
            print("Upload Failure , result is : ")
            print(result)
            print()
            await device_client.notify_blob_upload_status(
                storage_info["correlationId"], False, result.status_code, str(
                    result)
            )
    except Exception as ex:
        print("Exception : ")
        print(ex)

    except KeyboardInterrupt:
        print("STOPPED >>>INTERRUPT<<")

    finally:
        await device_client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
