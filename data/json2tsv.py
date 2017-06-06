#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import csv
import sys
import argparse

def main(inputfile, outputfile):
    data = json.load(inputfile)
    writer = csv.writer(outputfile, delimiter='\t')
    separator = '|'

    writer.writerow(['name', 'size', 'imports'])
    for entry in data:
        writer.writerow([entry['name'], entry['size'], separator.join(entry['imports'])])

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert json to csv")
    parser.add_argument("inputfile", type=argparse.FileType('r'))
    parser.add_argument("outputfile", type=argparse.FileType('w'))
    args = parser.parse_args()
    main(args.inputfile, args.outputfile)
