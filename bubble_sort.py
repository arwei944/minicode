def bubble_sort(arr):
    """冒泡排序"""
    n = len(arr)
    for i in range(n - 1):
        # 每轮遍历将最大的元素冒泡到最后
        for j in range(n - 1 - i):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr


if __name__ == '__main__':
    test = [64, 34, 25, 12, 22, 11, 90]
    print("排序前:", test)
    bubble_sort(test)
    print("排序后:", test)
