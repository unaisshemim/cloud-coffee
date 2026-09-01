output "bucket_name" {
  description = "Application upload bucket name."
  value       = aws_s3_bucket.uploads.bucket
}

output "bucket_arn" {
  description = "Application upload bucket ARN."
  value       = aws_s3_bucket.uploads.arn
}

output "object_arn_pattern" {
  description = "ARN pattern covering every object in the upload bucket."
  value       = "${aws_s3_bucket.uploads.arn}/*"
}
