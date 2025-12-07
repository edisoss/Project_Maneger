"use server"

import { put, del } from "@vercel/blob"

export async function uploadPhotoToBlob(formData: FormData) {
  try {
    const file = formData.get("file") as File
    const folderPath = formData.get("folderPath") as string | null

    if (!file) {
      return { success: false, error: "No file provided" }
    }

    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const baseFileName = file.name.replace(/\.[^/.]+$/, "")
    const uniqueFileName = `${baseFileName}_${timestamp}.${fileExtension}`

    const fullPath = folderPath ? `${folderPath}/${uniqueFileName}` : uniqueFileName

    console.log("[v0] Uploading to blob:", fullPath)

    const blob = await put(fullPath, file, {
      access: "public",
      addRandomSuffix: true,
    })

    console.log("[v0] Upload successful:", blob.url)

    return { success: true, url: blob.url, folderPath: folderPath || "" }
  } catch (error) {
    console.error("[v0] Error uploading to blob:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to upload file" }
  }
}

export async function deletePhotoFromBlob(photoUrl: string) {
  try {
    console.log("[v0] Deleting from blob:", photoUrl)
    await del(photoUrl)
    console.log("[v0] Delete successful")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error deleting from blob:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete file" }
  }
}
