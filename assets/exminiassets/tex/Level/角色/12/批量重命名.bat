@echo off
setlocal enabledelayedexpansion

:start
cls
echo.        ╔════════════════════════════════╗
echo.        ║                                ║
echo.        ║         批量文件重命名工具      ║
echo.        ║                                ║
echo.        ╚════════════════════════════════╝
echo.
echo.        [1] 添加前缀
echo.        [2] 添加后缀
echo.        [3] 主名称+序号
echo.        [4] 退出程序
echo.
echo.        ─────────────────────────────────
echo.
set /p "choice=请选择操作 (1-4): "
if "%choice%"=="1" goto :add_prefix
if "%choice%"=="2" goto :add_suffix
if "%choice%"=="3" goto :simple_numbering
if "%choice%"=="4" goto :exit_program

echo.
echo        [警告] 无效的选择，请重新输入！
timeout /t 2 >nul
goto :start

:add_prefix
cls
echo.        ╔════════════════════════════════╗
echo.        ║                                ║
echo.        ║         添加前缀               ║
echo.        ║                                ║
echo.        ╚════════════════════════════════╝
echo.
echo.        ─────────────────────────────────
echo.        命名规则：
echo.        - 前缀将添加到原文件名的最前面
echo.        - 示例：前缀为"风景_"，文件"1.jpg"将变为"风景_1.jpg"
echo.
set /p "prefix=请输入要添加的前缀: "
goto :get_file_type

:add_suffix
cls
echo.        ╔════════════════════════════════╗
echo.        ║                                ║
echo.        ║         添加后缀               ║
echo.        ║                                ║
echo.        ╚════════════════════════════════╝
echo.
echo.        ─────────────────────────────────
echo.        命名规则：
echo.        - 后缀将添加到原文件名和扩展名之间
echo.        - 示例：后缀为"_2023"，文件"1.jpg"将变为"1_2023.jpg"
echo.
set /p "suffix=请输入要添加的后缀: "
goto :get_file_type

:simple_numbering
cls
echo.        ╔════════════════════════════════╗
echo.        ║                                ║
echo.        ║       主名称+序号重命名         ║
echo.        ║                                ║
echo.        ╚════════════════════════════════╝
echo.
echo.        ─────────────────────────────────
echo.        格式示例：
echo.        - 输入"照片"，文件将重命名为：照片1.jpg, 照片2.jpg...
echo.        - 输入"文档_"，文件将重命名为：文档_1.jpg, 文档_2.jpg...
echo.
set /p "main_name=请输入主名称: "
echo.
set "start_num=1"
set /p "start_num=请输入起始序号(默认1): "
if not defined start_num set start_num=1
set /a count=start_num-1
goto :get_file_type

:get_file_type
echo.
set /p "ext=请输入文件类型(如 txt,jpg, 或 * 表示所有文件): "
if "%ext%"=="" set "ext=*"
if not "%ext:~0,1%"=="." if "%ext%" neq "*" set "ext=.%ext%"
set "ext=%ext:.=.%"
set "ext=%ext: =%"

echo.
echo.        ─────────────────────────────────
echo.
if "%choice%"=="1" echo        要添加的前缀: "%prefix%"
if "%choice%"=="2" echo        要添加的后缀: "%suffix%"
if "%choice%"=="3" (
    echo        主名称: "%main_name%"
    echo        起始序号: %start_num%
)
echo.
echo.        ─────────────────────────────────
echo.

set /p "confirm=确认开始处理? (Y/N): "
if /i "%confirm%" neq "Y" (
    echo.
    echo        操作已取消
    timeout /t 2 >nul
    goto :start
)

set success=0
set failed=0

for /f "delims=" %%f in ('dir /b "*%ext%" ^| findstr /v /i "%~nx0"') do (
    set /a count+=1
    set "fileext=%%~xf"
    set "fullname=%%f"
    
    if "%choice%"=="1" (
        set "newname=%prefix%%%f"
    ) else if "%choice%"=="2" (
        set "newname=%%~nf%suffix%%%xf"
    ) else if "%choice%"=="3" (
        set "newname=%main_name%!count!!fileext!"
    )
    
    if not "!fullname!"=="!newname!" (
        ren "!fullname!" "!newname!" >nul 2>&1
        if !errorlevel! equ 0 (
            echo        [成功] 已重命名: "!fullname!" → "!newname!"
            set /a success+=1
        ) else (
            echo        [失败] 重命名失败: "!fullname!"
            set /a failed+=1
        )
    ) else (
        echo        [提示] 名称未变化: "!fullname!"
    )
)

echo.
echo.        ─────────────────────────────────
echo.
echo        总计处理 %count% 个文件
echo        成功重命名: %success% 个
echo        重命名失败: %failed% 个
echo.
echo.        ─────────────────────────────────
echo.

set /p "again=是否继续操作? (Y/N): "
if /i "%again%"=="Y" goto :start

:exit_program
cls
echo.        ╔════════════════════════════════╗
echo.        ║                                ║
echo.        ║         批量文件重命名工具      ║
echo.        ║                                ║
echo.        ╚════════════════════════════════╝
echo.
echo.        感谢使用！程序将在3秒后退出...
echo.
echo.        ─────────────────────────────────
timeout /t 3 >nul
endlocal
exit /b