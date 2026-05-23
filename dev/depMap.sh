#!/bin/bash

# Target directory containing the javascript files
SRC_DIR="../js"
OUT_DIR="$(pwd)"

echo "Output target path: ${OUT_DIR}"

# Start writing the dependency graph file cleanly
echo "digraph G {" > "${OUT_DIR}/deps.dot"
echo "  rankdir=LR;" >> "${OUT_DIR}/deps.dot"
echo "  node [shape=box, fontname=\"Arial\", fontsize=11];" >> "${OUT_DIR}/deps.dot"

# Ensure target source directory actually exists before entering
if [ ! -d "$SRC_DIR" ]; then
    echo "Error: Directory $SRC_DIR does not exist."
    exit 1
fi

# Find all JS files without using subshells, loop safely
while IFS= read -r filepath; do
    # 1. Normalize the file name (e.g., ./components/header.js -> header.js)
    filename=$(basename "$filepath")

    echo "Analyzing: $filename"

    # 2. Extract lines containing imports or requires
    grep -E "import .* from|require\(" "$filepath" | while IFS= read -r line; do

        # Extract the inner string between single or double quotes
        dep_path=$(echo "$line" | sed -E "s/.*['\"]([^'\"]+)['\"].*/\1/")

        # -n checks if the variable is NOT empty
        if [ -n "$dep_path" ]; then
            # Strip path prefixes and file extensions to get a clean module identity
            clean_dep=$(basename "$dep_path" | sed 's/\.js$//')
            clean_file=$(echo "$filename" | sed 's/\.js$//')

            # Write the unified clean reference line to the dot file
            echo "  \"$clean_file\" -> \"$clean_dep\";" >> "${OUT_DIR}/deps.dot"
        fi
    done
done < <(find "$SRC_DIR" -type f -name "*.js" -not -path "*/node_modules/*")

echo "}" >> "${OUT_DIR}/deps.dot"

# Compile vector layouts cleanly to PDF output
echo "Compiling vector layout structure to PDF..."
dot -Tpdf "${OUT_DIR}/deps.dot" -o "${OUT_DIR}/dependencies.pdf"
echo "Success! Saved visualization to ${OUT_DIR}/dependencies.pdf"