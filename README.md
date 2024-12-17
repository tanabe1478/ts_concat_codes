# ConcatCodes

## Usage

```bash
# Output to stdout (you can redirect to a file)
npx ts-node concat_code.ts path/to/dir1 path/to/dir2 > all_code.md

# Or specify an output file directly
npx ts-node concat_code.ts path/to/dir1 path/to/dir2 -o merged_output.md

# For macOS: copy directly to clipboard
npx ts-node concat_code.ts path/to/dir1 path/to/dir2 | pbcopy
```

## Notes

Make sure that directories contain .gitignore files if you want to exclude certain files.
If you see any unreadable characters or binary data, consider filtering by file extension or adjusting .gitignore rules.
This tool is primarily tested on macOS.

## License

MIT License. Feel free to use and modify.