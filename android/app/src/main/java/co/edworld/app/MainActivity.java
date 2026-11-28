package co.edworld.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

public final class MainActivity extends Activity {
    private static final String WEBSITE = "https://edworld.co.in";
    private static final int CANVAS = 0xfff8f7f4;
    private static final int INK = 0xff22231f;
    private static final int MUTED = 0xff54564f;
    private static final int LINE = 0xffdfded8;
    private static final int ACCENT = 0xff305040;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(CANVAS);
        scroll.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(
                    insets.getSystemWindowInsetLeft(),
                    insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(),
                    insets.getSystemWindowInsetBottom());
            return insets;
        });

        LinearLayout layout = new LinearLayout(this);
        layout.setGravity(Gravity.CENTER_HORIZONTAL);
        layout.setOrientation(LinearLayout.VERTICAL);
        scroll.addView(layout);

        LinearLayout content = new LinearLayout(this) {
            @Override
            protected void onMeasure(int widthSpec, int heightSpec) {
                super.onMeasure(MeasureSpec.makeMeasureSpec(
                        Math.min(MeasureSpec.getSize(widthSpec), dp(520)), MeasureSpec.EXACTLY), heightSpec);
            }
        };
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(24), dp(32), dp(24), dp(32));
        layout.addView(content, new LinearLayout.LayoutParams(-1, -2));

        LinearLayout brand = new LinearLayout(this);
        brand.setGravity(Gravity.CENTER_VERTICAL);
        ImageView mark = new ImageView(this);
        mark.setImageResource(R.drawable.edworld_mark);
        mark.setBackground(surface(Color.BLACK, 12, Color.TRANSPARENT));
        mark.setPadding(dp(8), dp(8), dp(8), dp(8));
        mark.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        brand.addView(mark, new LinearLayout.LayoutParams(dp(44), dp(44)));
        TextView wordmark = text("EdWorld Co.", 17, INK, true);
        wordmark.setPadding(dp(12), 0, 0, 0);
        brand.addView(wordmark);
        content.addView(brand);

        LinearLayout access = new LinearLayout(this);
        add(content, access, 16);
        addAccountAction(access, "Sign in", "/login", true);
        addAccountAction(access, "Sign up", "/signup", false);

        TextView heading = text("Student workspace", 28, INK, true);
        if (android.os.Build.VERSION.SDK_INT >= 28) {
            heading.setAccessibilityHeading(true);
        }
        add(content, heading, 32);

        addDestination(content, "Dashboard", "Your study plan and progress", "/dashboard", 14);
        addDestination(content, "Learning & Myra", "Courses, practice, and AI study help", "/learn", 8);
        addDestination(content, "Jobs & internships", "Find open roles and apply", "/jobs", 8);
        addDestination(content, "Hackathons", "Discover events and competitions", "/hackathons", 8);
        addDestination(content, "Profile & applications", "Manage your profile and track applications", "/profile/applied", 8);
        setContentView(scroll);
    }

    private void addAccountAction(LinearLayout row, String label, String path, boolean primary) {
        TextView action = text(label, 15, primary ? Color.WHITE : INK, true);
        action.setGravity(Gravity.CENTER);
        action.setMinHeight(dp(48));
        action.setPadding(dp(8), dp(10), dp(8), dp(10));
        action.setBackground(clickableSurface(primary ? ACCENT : Color.WHITE, 12));
        makeAction(action, label, path);

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(0, -1, 1);
        if (!primary) {
            params.setMarginStart(dp(10));
        }
        row.addView(action, params);
    }

    private void addDestination(LinearLayout parent, String title, String detail, String path, int margin) {
        LinearLayout item = new LinearLayout(this);
        item.setGravity(Gravity.CENTER_VERTICAL);
        item.setMinimumHeight(dp(64));
        item.setPadding(dp(16), dp(12), dp(16), dp(12));
        item.setBackground(clickableSurface(Color.WHITE, 14));

        LinearLayout label = new LinearLayout(this);
        label.setOrientation(LinearLayout.VERTICAL);
        label.addView(text(title, 16, INK, true));
        TextView description = text(detail, 13, MUTED, false);
        description.setPadding(0, dp(3), 0, 0);
        label.addView(description);
        label.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS);
        item.addView(label, new LinearLayout.LayoutParams(0, -2, 1));

        TextView arrow = text("›", 25, ACCENT, false);
        arrow.setPadding(dp(12), 0, 0, 0);
        arrow.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        item.addView(arrow);
        makeAction(item, title + ". " + detail, path);
        add(parent, item, margin);
    }

    private void makeAction(View view, String description, String path) {
        view.setContentDescription(description);
        view.setFocusable(true);
        view.setOnClickListener(ignored -> openWebsite(path));
        view.setAccessibilityDelegate(new View.AccessibilityDelegate() {
            @Override
            public void onInitializeAccessibilityNodeInfo(View host, android.view.accessibility.AccessibilityNodeInfo info) {
                super.onInitializeAccessibilityNodeInfo(host, info);
                info.setClassName("android.widget.Button");
            }
        });
    }

    private void openWebsite(String path) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(WEBSITE + path));
        Bundle customTab = new Bundle();
        customTab.putBinder("android.support.customtabs.extra.SESSION", null);
        customTab.putInt("android.support.customtabs.extra.TOOLBAR_COLOR", CANVAS);
        customTab.putInt("android.support.customtabs.extra.TITLE_VISIBILITY", 1);
        intent.putExtras(customTab);

        try {
            startActivity(intent);
        } catch (ActivityNotFoundException unavailable) {
            new AlertDialog.Builder(this)
                    .setTitle("Browser needed")
                    .setMessage("Install a web browser to open EdWorld.")
                    .setPositiveButton(android.R.string.ok, null)
                    .show();
        }
    }

    private TextView text(String value, int size, int color, boolean strong) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        if (strong) {
            view.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        }
        return view;
    }

    private void add(LinearLayout parent, View view, int margin) {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, -2);
        params.topMargin = dp(margin);
        parent.addView(view, params);
    }

    private GradientDrawable surface(int color, int radius, int border) {
        GradientDrawable shape = new GradientDrawable();
        shape.setColor(color);
        shape.setCornerRadius(dp(radius));
        shape.setStroke(dp(1), border);
        return shape;
    }

    private RippleDrawable clickableSurface(int color, int radius) {
        return new RippleDrawable(ColorStateList.valueOf(0x22305040),
                surface(color, radius, color == Color.WHITE ? LINE : Color.TRANSPARENT), null);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
